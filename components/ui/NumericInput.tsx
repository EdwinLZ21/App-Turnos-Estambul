// components/ui/NumericInput.tsx
"use client"

import React from "react"

export function NumericInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  const { onChange, onKeyDown, value, ...rest } = props

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed =
      // Un solo carácter: dígito o coma
      (e.key.length === 1 && /[\d,]/.test(e.key)) ||
      // Teclas especiales: retroceso, borrar, flechas, tab, Enter
      [
        "Backspace",
        "Delete",
        "ArrowLeft",
        "ArrowRight",
        "Tab",
        "Enter",
      ].includes(e.key)

    if (!allowed) {
      e.preventDefault()
    }

    if (onKeyDown) onKeyDown(e)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Filtrar cualquier carácter no permitido
    const filtered = e.target.value.replace(/[^0-9,]/g, "")
    if (onChange) {
      // Reconstruir evento con el valor filtrado
      const event = {
        ...e,
        target: { ...e.target, value: filtered },
      }
      onChange(event as any)
    }
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9,]*"
      autoComplete="off"
      {...rest}
      value={value}
      onKeyDown={handleKeyDown}
      onChange={handleChange}
      className={`${props.className ?? ""} w-full border rounded px-3 py-2 focus:outline-none focus:ring`}
    />
  )
}
