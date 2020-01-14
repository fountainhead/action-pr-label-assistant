import * as core from '@actions/core'
import {GitHub} from '@actions/github'

import {upsertGuidance} from './guidance'
import {presence} from './presence'

async function run(): Promise<void> {
  try {
    const client = new GitHub(core.getInput('token', {required: true}))
    const whitelist = core.getInput('whitelist', {required: true}).split(',')

    await upsertGuidance({
      client,

      whitelist,
      id: core.getInput('id', {required: true}),

      pre: core.getInput('pre') || '',
      post: core.getInput('post') || ''
    })

    for (const {label, state} of await presence({client, whitelist})) {
      core.setOutput(label, state)
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
