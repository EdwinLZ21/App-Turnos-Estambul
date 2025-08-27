// components/ui/CustomNumericKeyboard.tsx
"use client"
import React from "react"

export function CustomNumericKeyboard({
  onInsert,
  onDelete,
  onClose,
}: {
  onInsert: (char: string) => void
  onDelete: () => void
  onClose: () => void
}) {
  const keys = ["1","2","3","4","5","6","7","8","9",",","0"]

  return (
    <div className="fixed inset-x-0 bottom-0 bg-black bg-opacity-25 flex justify-center p-2 z-50">
      <div className="bg-white rounded-t-lg w-full max-w-md">
        <div className="grid grid-cols-3 gap-2 p-4">
          {keys.map((k) => (
            <button
              key={k}
              onClick={() => onInsert(k)}
              className="py-4 text-2xl font-bold bg-gray-100 rounded-lg active:bg-gray-200"
            >
              {k}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full py-3 text-lg text-red-600 border-t"
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}

