'use client'

import { useEffect } from 'react'
import { Button } from '@pixeleye/ui'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className='mt-12 '>
      <div className="mx-auto w-fit flex flex-col items-center">

        <h2 className="text-xl text-on-surface">Something went wrong!</h2>
        <p className="text-error mb-8">{error.message}</p>
        <Button
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
        >
          Try again
        </Button>
      </div>

    </div>
  )
}