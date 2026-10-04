import { z } from 'zod'

/**
 * Converts a Zod Schema to Gemini JSON Schema format.
 */
export function zodToGeminiSchema(zodSchema) {
  if (!zodSchema) return { type: 'OBJECT', properties: {} }
  if (typeof zodSchema === 'object' && !zodSchema._def && !zodSchema.typeName) {
    // If passed a plain object of zod fields like { url: z.string() }
    zodSchema = z.object(zodSchema)
  }

  function convert(def) {
    if (!def) return { type: 'STRING' }

    let current = def
    let description = current.description || current._def?.description
    let typeName = current.typeName || current._def?.typeName

    while (
      typeName === 'ZodOptional' ||
      typeName === 'ZodNullable' ||
      typeName === 'ZodDefault' ||
      typeName === 'ZodCatch' ||
      typeName === 'ZodEffects'
    ) {
      current = current._def?.innerType || current._def?.schema
      if (!current) break
      description = description || current.description || current._def?.description
      typeName = current.typeName || current._def?.typeName
    }

    if (!current) return { type: 'STRING', ...(description ? { description } : {}) }
    const cDef = current._def || current

    let res = {}
    if (typeName === 'ZodString') {
      res = { type: 'STRING' }
    } else if (typeName === 'ZodNumber') {
      res = { type: 'NUMBER' }
    } else if (typeName === 'ZodBoolean') {
      res = { type: 'BOOLEAN' }
    } else if (typeName === 'ZodEnum') {
      res = { type: 'STRING', enum: cDef.values }
    } else if (typeName === 'ZodArray') {
      res = { type: 'ARRAY', items: convert(cDef.type) }
    } else if (typeName === 'ZodObject') {
      const props = {}
      const shape = typeof current.shape === 'object' ? current.shape : (cDef.shape ? cDef.shape() : {})
      for (const [key, val] of Object.entries(shape)) {
        props[key] = convert(val)
      }
      res = { type: 'OBJECT', properties: props }
    } else if (typeName === 'ZodUnion') {
      const options = cDef.options || []
      const hasNumber = options.some(o => (o._def?.typeName || o.typeName) === 'ZodNumber')
      res = { type: hasNumber ? 'NUMBER' : 'STRING' }
    } else {
      res = { type: 'STRING' }
    }

    if (description) res.description = description
    return res
  }

  const converted = convert(zodSchema)
  if (converted.type !== 'OBJECT') {
    return { type: 'OBJECT', properties: { input: converted } }
  }
  return converted
}
