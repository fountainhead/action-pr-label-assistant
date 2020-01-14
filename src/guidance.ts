import {GitHub, context} from '@actions/github'
import Octokit from '@octokit/rest'
import {emojify} from 'node-emoji'
import {stringify} from 'querystring'

import {sanitizeName} from './common'

interface Label {
  name: string
  color: string
  description: string
}

export const repoLabels = async (
  client: GitHub,
  whitelist: string[],
  repo: typeof context.repo
): Promise<Label[]> => {
  const {data} = await client.issues.listLabelsForRepo(repo)

  return data
    .filter(({name}) => whitelist.includes(sanitizeName(name)))
    .map(({name, color, description}) => ({name, color, description}))
}

export const renderLabel = (label: Label): string => {
  const queryString = stringify({
    text: emojify(label.name),
    bgcolor: label.color
  })

  return `![${label.name}](https://labl.es/svg?${queryString})`
}

export const idTag = (id: string): string => `\`id: pr-label-assistant-${id}\``

export const matchesIdTag = (id: string, comment: string): boolean =>
  comment.endsWith(idTag(id))

export const renderGuidance = (
  id: string,
  labels: Label[],
  pre: string,
  post: string
): string => {
  const rows = labels
    .map(label => {
      return `| ${renderLabel(label)} | ${label.description} |`
    })
    .join('\n')

  return `
${pre}

The following labels may be assigned to this Pull Request:

| Label | Description |
|-------|-------------|
${rows}

${post}

${idTag(id)}`
}

interface Comment {
  body: string
  id: number
}

export const matchingGuidanceComment = async (
  client: GitHub,
  id: string,
  prNumber: number,
  repo: typeof context.repo
): Promise<Comment | undefined> => {
  const options = client.issues.listComments.endpoint.merge({
    ...repo,
    // eslint-disable-next-line @typescript-eslint/camelcase
    issue_number: prNumber
  })

  const matchingComments: Comment[] = await client.paginate(
    options,
    (response: Octokit.Response<Octokit.IssuesListCommentsResponse>, done) => {
      for (const comment of response.data) {
        if (matchesIdTag(id, comment.body)) {
          done()

          return {
            body: comment.body,
            id: comment.id
          }
        }
      }
    }
  )

  return matchingComments[0]
}

interface Options {
  client: GitHub
  id: string
  whitelist: string[]
  pre: string
  post: string
  prNumber: number
  repo: typeof context.repo
}

export const upsertGuidance = async (options: Options): Promise<void> => {
  const {client, id, whitelist, pre, post, prNumber, repo} = options

  const labels = await repoLabels(client, whitelist, repo)

  const rendered = renderGuidance(id, labels, pre, post)

  const match = await matchingGuidanceComment(client, id, prNumber, repo)

  if (match) {
    if (match.body !== rendered) {
      client.issues.updateComment({
        ...repo,
        // eslint-disable-next-line @typescript-eslint/camelcase
        comment_id: match.id,
        body: rendered
      })
    }
  } else {
    client.issues.createComment({
      ...repo,
      // eslint-disable-next-line @typescript-eslint/camelcase
      issue_number: prNumber,
      body: rendered
    })
  }
}
