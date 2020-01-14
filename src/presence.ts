import {GitHub, context} from '@actions/github'

import {sanitizeName} from './common'

interface Options {
  client: GitHub
  whitelist: string[]
  prNumber: number
  repo: typeof context.repo
}

interface Presence {
  label: string
  state: 'present' | 'absent'
}

export const presence = async (options: Options): Promise<Presence[]> => {
  const {client, whitelist, prNumber, repo} = options

  const {data: appliedLabels} = await client.issues.listLabelsOnIssue({
    ...repo,
    // eslint-disable-next-line @typescript-eslint/camelcase
    issue_number: prNumber
  })

  return whitelist.map(label => ({
    label,
    state: appliedLabels.find(({name}) => label === sanitizeName(name))
      ? 'present'
      : 'absent'
  }))
}
