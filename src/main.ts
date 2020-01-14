import * as core from '@actions/core'
import {GitHub, context} from '@actions/github'

import {upsertGuidance} from './guidance'

async function run(): Promise<void> {
  try {
    if (!context.payload.pull_request) {
      throw new Error(
        'Only events of type `pull_request` are supported by this Action.'
      )
    }

    await upsertGuidance({
      client: new GitHub(core.getInput('token', {required: true})),

      id: core.getInput('id', {required: true}),
      whitelist: core.getInput('whitelist', {required: true}).split(','),

      pre: core.getInput('pre') || '',
      post: core.getInput('post') || ''
    })
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
