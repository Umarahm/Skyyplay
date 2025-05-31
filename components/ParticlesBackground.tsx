"use client"

import { useEffect } from "react"

declare global {
  interface Window {
    particlesJS: any
  }
}

export function ParticlesBackground() {
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js"
    script.onload = () => {
      if (window.particlesJS) {
        window.particlesJS("particles-js", {
          particles: {
            number: {
              value: 80,
              density: {
                enable: true,
                value_area: 800,
              },
            },
            color: {
              value: "#a855f7",
            },
            shape: {
              type: "circle",
            },
            opacity: {
              value: 0.2,
              random: true,
              animation: {
                enable: true,
                speed: 1,
                opacity_min: 0.1,
                sync: false,
              },
            },
            size: {
              value: 3,
              random: true,
              animation: {
                enable: true,
                speed: 2,
                size_min: 0.1,
                sync: false,
              },
            },
            line_linked: {
              enable: true,
              distance: 150,
              color: "#a855f7",
              opacity: 0.2,
              width: 1,
            },
            move: {
              enable: true,
              speed: 1,
              direction: "none",
              random: true,
              straight: false,
              out_mode: "out",
              bounce: false,
            },
          },
          interactivity: {
            detect_on: "window",
            events: {
              onhover: {
                enable: true,
                mode: "grab",
              },
              onclick: {
                enable: true,
                mode: "push",
              },
              resize: true,
            },
            modes: {
              grab: {
                distance: 140,
                line_linked: {
                  opacity: 0.5,
                },
              },
              push: {
                particles_nb: 4,
              },
            },
          },
          retina_detect: true,
        })
      }
    }
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  return <div id="particles-js" className="fixed inset-0 pointer-events-none z-0" />
}
