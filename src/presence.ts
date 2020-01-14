import {GitHub, context} from '@actions/github'
import * as core from '@actions/core'

import {sanitizeName} from './common'

interface Options {
  client: GitHub
  whitelist: string[]
}

interface Presence {
  label: string
  state: 'present' | 'absent'
}

export const presence = async (options: Options): Promise<Presence[]> => {
  if (!context.payload.pull_request) {
    throw new Error(
      'Only events of type `pull_request` are supported by this Action.'
    )
  }

  const {client, whitelist} = options
  const {data: appliedLabels} = await client.issues.listLabelsOnIssue({
    ...context.repo,
    // eslint-disable-next-line @typescript-eslint/camelcase
    issue_number: context.payload.pull_request.number
  })

  core.debug(JSON.stringify(whitelist, null, 2))
  core.debug(JSON.stringify(appliedLabels, null, 2))
  return whitelist.map(label => ({
    label,
    state: appliedLabels.find(({name}) => name === sanitizeName(label))
      ? 'present'
      : 'absent'
  }))
}
