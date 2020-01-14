import slugify from 'slugify'
import {emojify} from 'node-emoji'

export const sanitizeName = (name: string): string =>
  slugify(emojify(name), {lower: true})
