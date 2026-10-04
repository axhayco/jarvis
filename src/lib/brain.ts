import { BACKEND } from '../config'
import * as bridge from './bridge'
import type { AskHandlers } from './bridge'
import type { Blade, Panel } from '../store'

export type Msg = {
  role: 'user' | 'assistant'
  content: string
}

export type { AskHandlers }
export type { ConnectionState } from './bridge'

export const usingBridge = BACKEND === 'bridge'

export async function ask(
  prompt: string,
  _history: Msg[],
  handlers: AskHandlers,
): Promise<{ text: string; tools: string[] }> {
  return bridge.ask(prompt, handlers)
}

export async function warm(): Promise<void> {
  if (usingBridge) await bridge.warmBridge()
}

export function watchServers(fn: (servers: string[]) => void): void {
  if (usingBridge) bridge.watchServers(fn)
}

export function watchPanels(fn: (panel: Panel) => void): void {
  if (usingBridge) bridge.watchPanels(fn)
}

export function watchBlades(fn: (blade: Blade) => void): void {
  if (usingBridge) bridge.watchBlades(fn)
}

export function watchUi(fn: (op: string, args: any) => void): void {
  if (usingBridge) bridge.watchUi(fn)
}

export function watchCapture(
  fn: (req: bridge.CaptureRequest) => Promise<bridge.CaptureResult>,
): void {
  if (usingBridge) bridge.watchCapture(fn)
}

export function cancel(): void {
  if (usingBridge) bridge.cancel()
}

export function interrupt(): void {
  cancel()
}

export function isConnected(): boolean {
  return usingBridge ? bridge.isConnected() : true
}

export function watchConnection(
  fn: (state: bridge.ConnectionState) => void,
): void {
  if (usingBridge) bridge.watchConnection(fn)
}

export function connectedLabels(): string[] {
  return usingBridge ? bridge.bridgeServers() : []
}
