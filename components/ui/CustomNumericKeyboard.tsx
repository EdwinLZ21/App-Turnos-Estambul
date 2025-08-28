// components/ui/CustomNumericKeyboard.tsx
"use client"
import React, { useEffect, useRef } from "react"
export function CustomNumericKeyboard({
  onInsert,
  onDelete,
  onClose,
}: {
  onInsert: (char: string) => void
  onDelete: () => void
  onClose: () => void
}) {
  const keys = ["1","2","3","4","5","6","7","8","9",",","0","⌫"]
  const keyboardRef = useRef<HTMLDivElement>(null)
  // Simular comportamiento de teclado nativo: solo aparece si hay poco espacio
  useEffect(() => {
    const handleResize = () => {
      if (keyboardRef.current) {
        const viewportHeight = window.innerHeight
        const keyboardHeight = 250
        
        // Solo agregar padding si realmente es necesario
        if (viewportHeight < 600) { // Pantallas pequeñas
          document.body.style.paddingBottom = `${keyboardHeight}px`
        }
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    
    return () => {
      document.body.style.paddingBottom = ''
      window.removeEventListener('resize', handleResize)
    }
  }, [])
  return (
    <div 
      ref={keyboardRef}
      className="fixed bottom-0 left-0 right-0 bg-gray-100 border-t border-gray-300 z-50 numeric-keyboard"
      style={{
        transform: 'translateY(0)',
        transition: 'transform 0.3s ease-in-out'
      }}
    >
      {/* Contenedor responsive que simula teclado nativo */}
      <div className="max-w-full mx-auto px-2 py-3 sm:px-4">
        
        {/* Grid adaptive según tamaño de pantalla */}
        <div className="grid grid-cols-3 gap-1 sm:gap-2 max-w-xs mx-auto">
          {keys.map((k) => (
            <button
              key={k}
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => e.preventDefault()}
              onClick={() => k === "⌫" ? onDelete() : onInsert(k)}
              className={`
                h-12 sm:h-14
                text-lg sm:text-xl font-semibold
                rounded-md
                active:scale-95 transition-transform
                ${k === "⌫" 
                  ? "bg-gray-300 hover:bg-gray-400 text-gray-700" 
                  : "bg-white hover:bg-gray-50 text-gray-900"
                }
                border border-gray-300 shadow-sm
                select-none
              `}
              style={{
                WebkitTapHighlightColor: 'transparent',
                userSelect: 'none'
              }}
            >
              {k}
            </button>
          ))}
        </div>
        {/* Botón cerrar discreto */}
        <div className="flex justify-center mt-2">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            onClick={onClose}
            className="px-6 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            style={{
              WebkitTapHighlightColor: 'transparent',
              userSelect: 'none'
            }}
          >
            ✕ Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}



