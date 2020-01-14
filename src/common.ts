import slugify from 'slugify'
import {emojify} from 'node-emoji'

const REMOVE_REGEX = /[^a-zA-Z0-9 -]/g

export const sanitizeName = (name: string): string =>
  slugify(emojify(name), {
    lower: true,
    remove: REMOVE_REGEX
  })
