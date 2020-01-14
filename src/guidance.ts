import {GitHub, context} from '@actions/github'
import Octokit from '@octokit/rest'
import {emojify} from 'node-emoji'
import {stringify} from 'querystring'
import slugify from 'slugify'

interface Label {
  name: string
  color: string
  description: string
}

export const sanitizeName = (name: string): string =>
  slugify(emojify(name), {lower: true})

export const repoLabels = async (
  client: GitHub,
  whitelist: string[]
): Promise<Label[]> => {
  const {data} = await client.issues.listLabelsForRepo(context.repo)

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
  id: string
): Promise<Comment | undefined> => {
  if (!context.payload.pull_request) {
    throw new Error(
      'Only events of type `pull_request` are supported by this Action.'
    )
  }

  const options = client.issues.listComments.endpoint.merge({
    ...context.repo,
    number: context.payload.pull_request.number
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
}

export const upsertGuidance = async (options: Options): Promise<void> => {
  if (!context.payload.pull_request) {
    throw new Error(
      'Only events of type `pull_request` are supported by this Action.'
    )
  }

  const {client, id, whitelist, pre, post} = options

  const labels = await repoLabels(client, whitelist)

  const rendered = renderGuidance(id, labels, pre, post)

  const match = await matchingGuidanceComment(client, id)

  if (match) {
    if (match.body !== rendered) {
      client.issues.updateComment({
        ...context.repo,
        // eslint-disable-next-line @typescript-eslint/camelcase
        comment_id: match.id,
        body: rendered
      })
    }
  } else {
    client.issues.createComment({
      ...context.repo,
      // eslint-disable-next-line @typescript-eslint/camelcase
      issue_number: context.payload.pull_request.number,
      body: rendered
    })
  }
}
