import * as core from '@actions/core'
import {GitHub, context} from '@actions/github'

import {upsertGuidance} from './guidance'
import {presence} from './presence'

async function run(): Promise<void> {
  try {
    if (!context.payload.pull_request) {
      throw new Error(`This Action is only supported on 'pull_request' events.`)
    }

    const client = new GitHub(core.getInput('token', {required: true}))
    const whitelist = core.getInput('whitelist', {required: true}).split(',')
    const {repo} = context
    const prNumber = context.payload.pull_request.number

    await upsertGuidance({
      client,
      repo,
      prNumber,

      whitelist,
      id: core.getInput('id', {required: true}),

      pre: core.getInput('pre') || '',
      post: core.getInput('post') || ''
    })

    for (const {label, state} of await presence({
      client,
      repo,
      prNumber,
      whitelist
    })) {
      core.setOutput(label, state)
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
