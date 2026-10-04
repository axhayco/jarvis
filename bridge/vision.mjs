import { z } from 'zod'

/**
 * @param {(kind: string, args: object) => Promise<object>} ask
 *   Sends a request to the browser and resolves with its reply.
 */
export function visionTools(ask) {
  return [
    {
      name: 'look',
      description: DESCRIPTION,
      schema: z.object({
        reason: z
          .string()
          .optional()
          .catch(undefined)
          .describe(
            'A few words on what you are looking for, shown to the user while ' +
              'the camera is live. They can see the light; tell them why.',
          ),
      }),
      execute: async (args) => {
        let reply
        try {
          reply = await ask('capture', { reason: String(args.reason ?? '').slice(0, 80) })
        } catch (err) {
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text:
                  `Could not reach the camera: ${err?.message ?? err}. ` +
                  'Tell the user you cannot see and carry on without it.',
              },
            ],
          }
        }

        if (reply?.error) {
          return {
            isError: true,
            content: [{ type: 'text', text: String(reply.error) }],
          }
        }
        if (typeof reply?.data !== 'string' || !reply.data) {
          return {
            isError: true,
            content: [{ type: 'text', text: 'The camera returned nothing.' }],
          }
        }

        return {
          content: [
            { type: 'text', text: 'One frame from the camera:' },
            {
              type: 'image',
              data: reply.data,
              mimeType: reply.mimeType ?? 'image/jpeg',
            },
          ],
        }
      },
    },
    {
      name: 'watch',
      description: WATCH_DESCRIPTION,
      schema: z.object({
        seconds: z
          .union([z.number(), z.string()])
          .optional()
          .catch(undefined)
          .describe('How long to watch, 2 to 15. Default 6.'),
        when: z
          .enum(['now', 'past'])
          .optional()
          .catch(undefined)
          .describe(
            "now = watch what happens next, starting immediately. " +
              "past = look at the seconds that have ALREADY happened, which " +
              'only works while the camera is open on screen.',
          ),
        reason: z
          .string()
          .optional()
          .catch(undefined)
          .describe('A few words on what you are watching for, shown on screen.'),
      }),
      execute: async (args) => {
        let reply
        try {
          reply = await ask(
            'capture',
            {
              mode: 'watch',
              seconds: Number(args.seconds) || 6,
              when: args.when ?? 'now',
              reason: String(args.reason ?? '').slice(0, 80),
            },
            45_000,
          )
        } catch (err) {
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: `Could not watch: ${err?.message ?? err}. Tell the user and carry on.`,
              },
            ],
          }
        }
        if (reply?.error) {
          return { isError: true, content: [{ type: 'text', text: String(reply.error) }] }
        }
        if (typeof reply?.data !== 'string' || !reply.data) {
          return { isError: true, content: [{ type: 'text', text: 'The camera returned nothing.' }] }
        }
        return {
          content: [
            {
              type: 'text',
              text:
                'Frames from the camera, in order, each stamped with its time ' +
                'offset in seconds. Read them left to right, top to bottom — ' +
                'they are one continuous clip, not separate pictures.',
            },
            { type: 'image', data: reply.data, mimeType: reply.mimeType ?? 'image/jpeg' },
          ],
        }
      },
    },
  ]
}
