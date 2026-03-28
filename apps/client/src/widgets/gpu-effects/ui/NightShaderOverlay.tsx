import { useEffect, useRef, useState } from 'react'

/**
 * Night overlay using raw WebGPU (no TypeGPU React hooks — they have alpha bugs).
 * Renders a fullscreen dark blue vignette with breathing pulse.
 */

const WGSL_SHADER = /* wgsl */ `
struct Uniforms {
  darkness: f32,
  time: f32,
}

@group(0) @binding(0) var<uniform> u: Uniforms;

struct VsOut {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
}

@vertex fn vs(@builtin(vertex_index) i: u32) -> VsOut {
  var p = array<vec2f, 6>(
    vec2f(-1, 1), vec2f(-1,-1), vec2f(1,-1),
    vec2f(-1, 1), vec2f(1,-1), vec2f(1, 1),
  );
  var uv = array<vec2f, 6>(
    vec2f(0,1), vec2f(0,0), vec2f(1,0),
    vec2f(0,1), vec2f(1,0), vec2f(1,1),
  );
  var o: VsOut;
  o.pos = vec4f(p[i], 0, 1);
  o.uv = uv[i];
  return o;
}

@fragment fn fs(v: VsOut) -> @location(0) vec4f {
  let dark = u.darkness;
  if (dark < 0.01) { return vec4f(0, 0, 0, 0); }
  let nightColor = vec3f(0.03, 0.01, 0.12);
  let center = v.uv - vec2f(0.5, 0.5);
  let vignette = 1.0 - length(center) * 0.6;
  let pulse = sin(u.time * 0.8) * 0.03 + 1.0;
  let alpha = dark * (0.65 + 0.35 * (1.0 - vignette)) * pulse;
  return vec4f(nightColor * alpha, alpha);
}
`

function NightCanvas({ darkness }: { darkness: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const gpuRef = useRef<{
    device: GPUDevice
    pipeline: GPURenderPipeline
    uniformBuffer: GPUBuffer
    bindGroup: GPUBindGroup
    ctx: GPUCanvasContext
  } | null>(null)
  const startTime = useRef(performance.now())

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !navigator.gpu) return

    let cancelled = false

    async function init() {
      const adapter = await navigator.gpu.requestAdapter()
      if (!adapter || cancelled) return
      const device = await adapter.requestDevice()
      if (cancelled) return

      const ctx = canvas!.getContext('webgpu')!
      const format = navigator.gpu.getPreferredCanvasFormat()
      ctx.configure({ device, format, alphaMode: 'premultiplied' })

      const module = device.createShaderModule({ code: WGSL_SHADER })

      const uniformBuffer = device.createBuffer({
        size: 8, // 2 x f32
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      })

      const bindGroupLayout = device.createBindGroupLayout({
        entries: [{ binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } }],
      })

      const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
      })

      const pipeline = device.createRenderPipeline({
        layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
        vertex: { module, entryPoint: 'vs' },
        fragment: {
          module,
          entryPoint: 'fs',
          targets: [{
            format,
            blend: {
              color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' },
              alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' },
            },
          }],
        },
        primitive: { topology: 'triangle-list' },
      })

      gpuRef.current = { device, pipeline, uniformBuffer, bindGroup, ctx }
    }

    init()
    return () => { cancelled = true }
  }, [])

  // Render loop
  useEffect(() => {
    function render() {
      const gpu = gpuRef.current
      const canvas = canvasRef.current
      if (!gpu || !canvas) {
        rafRef.current = requestAnimationFrame(render)
        return
      }

      // Resize canvas to match display
      const dpr = window.devicePixelRatio || 1
      const w = Math.floor(canvas.clientWidth * dpr)
      const h = Math.floor(canvas.clientHeight * dpr)
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }

      const elapsed = (performance.now() - startTime.current) / 1000
      const data = new Float32Array([darkness, elapsed])
      gpu.device.queue.writeBuffer(gpu.uniformBuffer, 0, data)

      const encoder = gpu.device.createCommandEncoder()
      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: gpu.ctx.getCurrentTexture().createView(),
          loadOp: 'clear',
          storeOp: 'store',
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
        }],
      })
      pass.setPipeline(gpu.pipeline)
      pass.setBindGroup(0, gpu.bindGroup)
      pass.draw(6)
      pass.end()
      gpu.device.queue.submit([encoder.finish()])

      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(rafRef.current)
  }, [darkness])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
        opacity: darkness > 0 ? 1 : 0,
        transition: 'opacity 1s ease',
      }}
    />
  )
}

export function NightShaderOverlay({ isNight }: { isNight: boolean }) {
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    if (!navigator.gpu) setSupported(false)
  }, [])

  if (!supported) return null

  return <NightCanvas darkness={isNight ? 0.85 : 0} />
}
