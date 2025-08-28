// components/ui/NumericInput.tsx
"use client"
import React, { useState, useEffect } from "react"
import { CustomNumericKeyboard } from "./CustomNumericKeyboard"
export function NumericInput({
  onFocus,
  onBlur,
  value: propValue,
  onChange,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [value, setValue] = useState(propValue?.toString() || "")
  // Sincronizar con el valor externo
  useEffect(() => {
    setValue(propValue?.toString() || "")
  }, [propValue])
const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  setShowKeyboard(true)
  
  // Scroll mínimo, solo si es absolutamente necesario
  setTimeout(() => {
    const rect = e.target.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const keyboardHeight = 250
    
    // Solo hacer scroll si el campo estaría tapado
    if (rect.bottom > viewportHeight - keyboardHeight) {
      e.target.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }
  }, 300) // Delay para que aparezca el teclado primero
  
  if (onFocus) onFocus(e)
}
const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  // Solo cerrar si el click NO fue en el teclado
  setTimeout(() => {
    // Verificar si el elemento activo es parte del teclado
    const activeElement = document.activeElement
    const keyboardElement = document.querySelector('.numeric-keyboard')
    
    if (!keyboardElement?.contains(activeElement)) {
      setShowKeyboard(false)
      if (onBlur) onBlur(e)
    }
  }, 150)
}
  const handleInsert = (char: string) => {
    const newValue = value + char
    setValue(newValue)
    // Simular evento onChange
    if (onChange) {
      const event = {
        target: { value: newValue }
      } as React.ChangeEvent<HTMLInputElement>
      onChange(event)
    }
  }
  const handleDelete = () => {
    const newValue = value.toString().slice(0, -1)
    setValue(newValue)
    if (onChange) {
      const event = {
        target: { value: newValue }
      } as React.ChangeEvent<HTMLInputElement>
      onChange(event)
    }
  }
  const handleKeyboardClose = () => {
    setShowKeyboard(false)
  }
  return (
    <div className="relative">
      <input
        {...props}
        value={value}
        onFocus={handleFocus}
        onBlur={handleBlur}
        readOnly // Para forzar uso del teclado personalizado
        className={`${props.className || ""} cursor-pointer`}
      />
      {showKeyboard && (
        <CustomNumericKeyboard
          onInsert={handleInsert}
          onDelete={handleDelete}
          onClose={handleKeyboardClose}
        />
      )}
    </div>
  )
}


