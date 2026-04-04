import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    <h1>About</h1>
    <h2>Github</h2>
    <h2>Feedback</h2>
  </div>
}
