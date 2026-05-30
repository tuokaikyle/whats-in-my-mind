import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/grid-layout')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/grid"!</div>
}
