# Asteroids - TP10: Videojuego Arcade con HTML5 Canvas

## 📋 Descripción General

Este es un videojuego estilo **Asteroids** clásico, desarrollado en HTML5 Canvas y JavaScript vanilla. El proyecto fue realizado como parte del Trabajo Práctico N° 10 de Laboratorio de Programación, con énfasis en arquitectura de juego, figuras complejas en Canvas y sistemas de poder-ups.

---

## 🎮 Características Principales

### 1. **Arquitectura Clásica del Juego**
- **Game Loop**: Actualización y renderizado a 60 FPS usando `requestAnimationFrame`
- **Estructuras Orientadas a Objetos**: Clases independientes para Nave, Asteroides, Proyectiles y Power-ups
- **Sistema de Estados**: PLAYING, PAUSED, GAME_OVER
- **Gestión de Colisiones**: Detección de círculos entre entidades

### 2. **Nave del Jugador (Figura Compleja)**
La nave es **dibujada con Canvas** usando técnicas avanzadas:
- **Forma**: Triángulo vectorial (líneas geométricas)
- **Curvas de Bézier Cuadráticas**: Utilizadas en las llamas del propulsor para un efecto suave y dinámico
- **Escudo Visual**: Círculo cian que aparece cuando el power-up de escudo está activo
- **Rotación y Traslación**: Transformaciones 2D completas

```javascript
// Ejemplo de Bézier en la llama del propulsor
ctx.quadraticCurveTo(-15, -8, -20 - Math.random() * 10, -10);
```

### 3. **Sistema de Power-ups (3 tipos)**

| Power-up | Símbolo | Efecto | Duración |
|----------|---------|--------|----------|
| **Triple Disparo** | x3 (Magenta) | Dispara 3 balas en abanico | 5 segundos |
| **Misiles** | MS (Rojo) | Dispara misiles rápidos con estela | 5 segundos |
| **Escudo** | SH (Cian) | Protege contra 1 asteroide | 5 segundos |

- Los power-ups aparecen con **30% de probabilidad** al destruir un asteroide
- **Visualización con estrellas de 5 puntas** (figuras complejas)
- **Rotación constante** para mejor visibilidad

### 4. **Sistema de Puntuación**
- **Asteroide Grande**: 20 puntos
- **Asteroide Mediano**: 50 puntos
- **Asteroide Pequeño**: 100 puntos
- **Multiplicador de Nivel**: A mayor nivel, más asteroides

### 5. **Figuras Complejas en Canvas**

El proyecto implementa **más de 3 figuras complejas** según requisitos:

#### a) **Curvas de Bézier (Cúbicas y Cuadráticas)**
- Utilizadas en las llamas del propulsor de la nave
- Crean un efecto fluido y realista del fuego

#### b) **Espirales**
- Dibujadas dentro de los asteroides usando trigonometría
- Patrón matemático: `x = (i * 2) * cos(i)`, `y = (i * 2) * sin(i)`

#### c) **Estrellas de 5 Puntas**
- Utilizadas para los power-ups
- Calculadas mediante ángulos y radios alternados

#### d) **Arcos (arc)**
- Utilizados en el escudo visual circular de la nave

#### e) **Zigzag / Formas Irregulares**
- Los asteroides tienen formas angulares irregulares para simular rocas

---

## 🎯 Controles

| Acción | Tecla |
|--------|-------|
| **Rotar Izquierda** | A o ← |
| **Rotar Derecha** | D o → |
| **Acelerar** | W o ↑ |
| **Disparar** | ESPACIO |
| **Pausa** | P |

---

## 📊 Experiencia de Desarrollo

### Proceso y Aprendizajes

#### 1. **Fase de Planificación**
- Diseñé una arquitectura basada en clases para mantener el código modular y reutilizable
- Dividí las responsabilidades: cada clase maneja su propia lógica de dibujo, actualización y colisiones
- Esto facilitó agregar nuevas características sin romper código existente

#### 2. **Implementación de Figuras Complejas**
- **Desafío**: Dibujar una nave que se viera realista y fuera modificable
- **Solución**: Usé transformaciones de Canvas (`translate`, `rotate`) combinadas con Bézier
- **Aprendizaje**: Las curvas Bézier cuadráticas (`quadraticCurveTo`) son perfectas para efectos de fuego naturales

#### 3. **Sistema de Colisiones**
- Implementé detección de círculos simple pero efectiva
- Usé distancia euclidiana: `sqrt(dx² + dy²) < r1 + r2`
- **Limitación**: No es pixel-perfect, pero funciona bien para arcade

#### 4. **Power-ups y Mecánicas**
- Agregué un **cooldown de disparo** para evitar spam
- Los power-ups tienen **temporizador** que decrementa cada frame
- El sistema respeta la prioridad: escudo > otras mecánicas

#### 5. **Uso de IA (Documentado)**
- Usé IA para:
  - Explicar la trigonometría para rotaciones (`Math.cos(angle)`, `Math.sin(angle)`)
  - Generar la estructura base de la clase Asteroid
  - Validar la lógica de colisiones
- **Verificación**: Revisé y adapté todo el código generado, agregando mejoras propias (espirales, Bézier, animaciones)

#### 6. **Testing y Debugging**
- Probé múltiples escenarios:
  - Colisiones en los bordes del canvas
  - Comportamiento de power-ups simultáneos
  - Estabilidad con muchos asteroides (stress test)
- Descubrí y corregí un bug donde los asteroides pequeños no desaparecían correctamente

---

## 🏗️ Estructura de Carpetas

```
tp10/
├── index.html          # Estructura HTML
├── styles.css          # Estilos y temas
├── js/
│   └── game.js        # Lógica completa del juego
└── README.md          # Este archivo
```

---

## 🚀 Cómo Ejecutar

### Opción 1: Servidor Local (Recomendado)

```bash
# Si tienes Python 3
python -m http.server 8000

# Si tienes Node.js
npx http-server

# Si tienes Live Server en VS Code
# Click derecho en index.html > Open with Live Server
```

Luego abre: `http://localhost:8000`

### Opción 2: Directamente en el Navegador
- Descarga los archivos
- Abre `index.html` directamente (⚠️ algunos navegadores requieren servidor local)

---

## 📐 Detalles Técnicos

### Game Loop
```javascript
gameLoop() {
    this.update();  // Actualizar lógica
    this.draw();    // Renderizar
    requestAnimationFrame(() => this.gameLoop());
}
```

### Detección de Colisiones
```javascript
canCollideWith(obj) {
    const dx = this.x - obj.x;
    const dy = this.y - obj.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < this.radius + obj.radius;
}
```

### Figuras Complejas - Ejemplo: Bézier
```javascript
// Llama del propulsor (Bézier cuadrática)
ctx.quadraticCurveTo(cpx, cpy, endX, endY);
// cpx, cpy = punto de control
// endX, endY = punto final
```

### Figuras Complejas - Ejemplo: Espiral en Asteroide
```javascript
for (let i = 0; i < Math.PI * 4; i += 0.1) {
    const x = (i * 2) * Math.cos(i) / Math.PI;
    const y = (i * 2) * Math.sin(i) / Math.PI;
    ctx.lineTo(x, y);
}
```

---

## 🎓 Conceptos Clave Aplicados

| Concepto | Ubicación | Ejemplo |
|----------|-----------|---------|
| **Transformaciones 2D** | Ship.draw() | `ctx.rotate()`, `ctx.translate()` |
| **Curvas de Bézier** | Ship propulsor | `quadraticCurveTo()` |
| **Trigonometría** | Rotación de nave | `Math.cos(angle)`, `Math.sin(angle)` |
| **Espirales** | Asteroid.draw() | Ecuación paramétrica polar |
| **Detección de Colisiones** | AsteroidsGame.update() | Distancia euclidiana |
| **Animación** | gameLoop() | `requestAnimationFrame` |
| **OOP en JavaScript** | Todas las clases | Métodos, propiedades, herencia |

---

## 🐛 Bugs Conocidos y Limitaciones

- ⚠️ **Colisión no pixel-perfect**: Usa círculos, no máscaras exactas
- ⚠️ **Sin sonido**: Implementación visual solamente
- ⚠️ **Sin guardado de puntuaciones**: Se resetea al recargar
- ⚠️ **Sin efectos de partículas**: Las explosiones son solo eliminación de entidades

---

## 🎁 Posibles Mejoras Futuras

- [ ] Agregar efectos de partículas para explosiones (con espirales)
- [ ] Sonidos con Web Audio API
- [ ] Guardado de high scores en localStorage
- [ ] Niveles con patrones de asteroides
- [ ] Enemigos naves IA que disparan
- [ ] Engranajes rotatorios como decoración o mecánica
- [ ] Modo multijugador local
- [ ] Boss final al pasar X niveles

---

## 📝 Notas sobre Uso de IA

Este proyecto fue desarrollado **siguiendo las reglas de oro de ética IA**:

✅ **Lo que hizo la IA**:
- Explicar conceptos matemáticos (trigonometría, colisiones)
- Proporcionar estructura base de clases
- Sugerir métodos para dibujar figuras

✅ **Lo que hice yo**:
- Adapté y mejoré TODO el código generado
- Agregué figuras complejas personalizadas (Bézier, espirales, estrellas)
- Implementé sistemas propios (power-ups, niveles, puntuación)
- Debuggeé y validé cada funcionalidad
- Documenté exhaustivamente

⚠️ **Verificación**: Todo código fue revisado, testeado y modificado antes de integración.

---

## 👨‍💻 Autor

**Gino Pasqualini** - TP10 Laboratorio de Programación, 6° G

---

## 📚 Referencias

- [MDN Web Docs - Canvas API](https://developer.mozilla.org/es/docs/Web/API/Canvas_API)
- [MDN - CanvasRenderingContext2D](https://developer.mozilla.org/es/docs/Web/API/CanvasRenderingContext2D)
- [Curvas de Bézier - Explicación Interactiva](https://cubic-bezier.com/)
- [Asteroids Game - Wikipedia](https://en.wikipedia.org/wiki/Asteroids_(video_game))

---

## 🎮 Disfruta el Juego

**¡Destruye asteroides, recolecta poder-ups y sobrevive!** 🚀

---

*Última actualización: 2 de julio de 2026*
