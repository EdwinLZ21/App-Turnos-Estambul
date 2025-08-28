// components/ui/NumericInput.tsx
"use client"

import React, { useState, useEffect } from "react"
import { CustomNumericKeyboard } from "./CustomNumericKeyboard"

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string | number
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function NumericInput({
  onFocus,
  onBlur,
  value: propValue,
  onChange,
  ...props
}: Props) {
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [value, setValue] = useState(propValue?.toString() || "")

  // Sincroniza estado interno con propValue
  useEffect(() => {
    setValue(propValue?.toString() || "")
  }, [propValue])

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setShowKeyboard(true)
    setTimeout(() => {
      const rect = e.target.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const keyboardHeight = 250
      if (rect.bottom > viewportHeight - keyboardHeight) {
        e.target.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }, 300)
    onFocus?.(e)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      const activeElement = document.activeElement
      const keyboardElement = document.querySelector(".numeric-keyboard")
      if (!keyboardElement?.contains(activeElement)) {
        setShowKeyboard(false)
        onBlur?.(e)
      }
    }, 150)
  }

  const handleInsert = (char: string) => {
    // Solo permitir dígitos y coma
    if (!/^[0-9,]$/.test(char)) return
    const newValue = value + char
    setValue(newValue)
    onChange?.({ target: { value: newValue } } as React.ChangeEvent<HTMLInputElement>)
  }

  const handleDelete = () => {
    const newValue = value.slice(0, -1)
    setValue(newValue)
    onChange?.({ target: { value: newValue } } as React.ChangeEvent<HTMLInputElement>)
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
        readOnly
        inputMode="none"
        className={`${props.className || ""} cursor-pointer w-full`}
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


