import { NextResponse } from 'next/server'

// Python Flask API base URL
// In development: http://localhost:5328
// In production:  set PYTHON_API_URL env variable to your Render.com URL
const PYTHON_API = process.env.PYTHON_API_URL || 'http://localhost:5328'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get('endpoint') // poisson | binomial | zscore | covariance

  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint param' }, { status: 400 })
  }

  // Forward all other query params to the Python API
  const forwardParams = new URLSearchParams(searchParams)
  forwardParams.delete('endpoint')

  const url = `${PYTHON_API}/api/${endpoint}?${forwardParams.toString()}`

  try {
    const res = await fetch(url, { next: { revalidate: 0 } })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Python API unavailable',
        detail: err?.message ?? 'Could not connect to Python statistics service',
        python_url: PYTHON_API,
      },
      { status: 503 }
    )
  }
}
