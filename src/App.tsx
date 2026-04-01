import { useEffect, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { GitHubLink } from './components/GitHubLink'
import './styles/style.css'
import { glob, type GlobResult } from 'web-fs-glob'
import { separate } from './utils/string'

interface Options {
  dot: boolean
  ignore: string
  matchBase: boolean
  maxDepth: number
  nodir: boolean
  timeout: number
}

function App() {
  const parentRef = useRef<HTMLDivElement>(null)
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle>()

  const [options, setOptions] = useState<Options>({
    dot: false,
    ignore: '',
    matchBase: true,
    maxDepth: 0,
    nodir: false,
    timeout: 0,
  })

  const [pattern, setPattern] = useState('')
  const [result, setResult] = useState<GlobResult[]>([])
  const [lastError, setLastError] = useState<string>()

  const [isExploring, setIsExploring] = useState(false)
  const [displayTime, setDisplayTime] = useState<string>()
  const startTime = useRef<number>(null)

  const rowVirtualizer = useVirtualizer({
    count: result.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 30,
  })

  const pickDirectory = async () => {
    const dirHandle = await window.showDirectoryPicker()
    setDirectoryHandle(dirHandle)
  }

  const exploreDirectory = async () => {
    if (!directoryHandle) return

    setLastError(undefined)
    setResult([])
    setIsExploring(true)
    startTime.current = performance.now()

    try {
      setResult(
        await glob(pattern, {
          cwd: directoryHandle,
          dot: options.dot,
          ignore: separate(options.ignore),
          matchBase: options.matchBase,
          maxDepth: options.maxDepth || Infinity,
          nodir: options.nodir,
          signal:
            options.timeout > 0 ? AbortSignal.timeout(options.timeout) : undefined,
        }),
      )
    } catch (e) {
      if (!(e instanceof Error)) return
      setLastError(e.message)
    } finally {
      setIsExploring(false)
      if (startTime.current !== null) {
        setDisplayTime(((performance.now() - startTime.current) / 1000).toFixed(1))
      }
    }
  }

  useEffect(() => {
    if (!isExploring || startTime.current === null) return

    let requestId: number
    const update = () => {
      setDisplayTime(((performance.now() - startTime.current!) / 1000).toFixed(1))
      requestId = requestAnimationFrame(update)
    }

    requestId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(requestId)
  }, [isExploring])

  const toggleTooltip = (e: React.MouseEvent<HTMLDivElement>, show: boolean) => {
    const elem = e.currentTarget
    if (elem.clientWidth < elem.scrollWidth) {
      elem.nextElementSibling?.classList.toggle('hidden', !show)
    }
  }

  const updateOptions = (option: Partial<Options>) => {
    setOptions({
      ...options,
      ...option,
    })
  }

  return (
    <>
      <div className="flex justify-center py-5">
        <div className="flex w-175 flex-col gap-y-5">
          <h1 className="text-center text-4xl">web-fs-glob</h1>
          <hr className="border border-gray-300" />
          <div>
            <div
              className="flex h-25 w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 text-gray-500 transition-colors select-none hover:bg-gray-500/8"
              onClick={pickDirectory}
            >
              {directoryHandle && <div>&lt;{directoryHandle.name}&gt;</div>}
              <div>クリックしてディレクトリを{directoryHandle && '再'}選択</div>
            </div>
            <div className="flex justify-end mt-1">
              <a
                className="text-right text-xs text-cyan-600 hover:underline"
                href="https://github.com/vrcalphabet/web-fs-glob-test/releases/download/v1.0.0/web-fs-glob-fixture.zip"
                download
              >
                サンプルフォルダをダウンロード
              </a>
            </div>
          </div>

          <div>
            <label className="flex h-8 items-center gap-x-2">
              <span className="shrink-0">Globパターン:</span>
              <input
                type="text"
                className="h-full w-full border-2 border-gray-300 px-2 focus:border-cyan-600 focus:outline-none"
                placeholder="**/*.js"
                onChange={(e) => setPattern(e.target.value)}
              />
              <button
                className="h-full shrink-0 cursor-pointer rounded-sm bg-cyan-600 px-3 text-white select-none"
                onClick={exploreDirectory}
                disabled={isExploring}
              >
                実行
              </button>
            </label>

            <div className="mt-3 flex items-center gap-x-4 rounded-sm border border-gray-100 bg-gray-50 p-2 text-xs text-gray-600">
              <span className="shrink-0 font-bold text-gray-400">オプション:</span>
              <div className="flex flex-wrap gap-x-4 font-mono select-none">
                <label className="flex cursor-pointer items-center gap-x-1.5 transition-colors hover:text-cyan-600">
                  <input
                    type="checkbox"
                    className="accent-cyan-600"
                    checked={options.dot}
                    onChange={(e) => updateOptions({ dot: e.target.checked })}
                  />
                  <span>dot</span>
                </label>
                <label className="flex cursor-pointer items-center gap-x-1.5 transition-colors hover:text-cyan-600">
                  <input
                    type="checkbox"
                    className="accent-cyan-600"
                    checked={options.matchBase}
                    onChange={(e) => updateOptions({ matchBase: e.target.checked })}
                  />
                  <span>matchBase</span>
                </label>
                <label className="flex cursor-pointer items-center gap-x-1.5 transition-colors hover:text-cyan-600">
                  <input
                    type="checkbox"
                    className="accent-cyan-600"
                    checked={options.nodir}
                    onChange={(e) => updateOptions({ nodir: e.target.checked })}
                  />
                  <span>nodir</span>
                </label>
                <div className="flex items-center gap-x-2">
                  <span>maxDepth:</span>
                  <input
                    type="number"
                    placeholder="∞"
                    className="w-12 border border-gray-200 bg-white px-1 py-0.5 text-center focus:border-cyan-500 focus:outline-none"
                    min="0"
                    value={options.maxDepth ?? '0'}
                    onChange={(e) =>
                      updateOptions({ maxDepth: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="flex items-center gap-x-2">
                  <span>ignore:</span>
                  <input
                    type="text"
                    placeholder="**/node_modules/**, ..."
                    className="w-48 border border-gray-200 bg-white px-2 py-0.5 focus:border-cyan-500 focus:outline-none"
                    value={options.ignore}
                    onChange={(e) => updateOptions({ ignore: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-x-2">
                  <span>timeout:</span>
                  <input
                    type="number"
                    className="w-12 border border-gray-200 bg-white px-1 py-0.5 text-center focus:border-cyan-500 focus:outline-none"
                    min="0"
                    value={options.timeout ?? '0'}
                    onChange={(e) =>
                      updateOptions({ timeout: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
            </div>
            {lastError !== undefined && (
              <div className="mt-2 rounded-xs bg-red-200 px-4 py-2 text-red-900">
                Error:
                <br />
                {lastError}
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-col gap-y-2">
              <div
                ref={parentRef}
                className="h-150 overflow-auto border border-gray-200"
              >
                <div className="w-max">
                  <div className="sticky top-0 z-1 flex h-11 items-center border-b border-gray-200 bg-gray-50 px-4 shadow-sm select-none">
                    <div className="grid w-full grid-cols-[350px_100px_250px] gap-x-3 text-xs font-bold tracking-widest text-gray-400 uppercase">
                      <div>Path</div>
                      <div>Kind</div>
                      <div>Handle (クリックでコンソールに出力)</div>
                    </div>
                  </div>

                  <div
                    className="relative"
                    style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
                  >
                    {rowVirtualizer.getVirtualItems().map((item) => (
                      <div
                        key={item.key}
                        className="absolute top-0 left-0 flex w-full items-center px-4 transition-colors hover:bg-gray-200/50"
                        style={{
                          height: `${item.size}px`,
                          transform: `translateY(${item.start}px)`,
                        }}
                      >
                        <div className="grid grid-cols-[350px_100px_250px] items-center gap-x-3 font-mono text-sm whitespace-nowrap">
                          <div className="relative flex items-center text-gray-700">
                            <div
                              className="absolute w-[350px] truncate"
                              onMouseEnter={(e) => toggleTooltip(e, true)}
                              onMouseLeave={(e) => toggleTooltip(e, false)}
                            >
                              {result[item.index].path}
                            </div>
                            <div className="pointer-events-none absolute z-1 hidden rounded-xs bg-white pr-2 shadow-md">
                              {result[item.index].path}
                            </div>
                          </div>
                          <div className="text-gray-700 uppercase">
                            {result[item.index].kind}
                          </div>
                          <div
                            className="cursor-pointer text-sm text-gray-400 transition-colors select-none hover:text-blue-500"
                            onClick={() => {
                              console.log(result[item.index].handle)
                            }}
                          >
                            {result[item.index].handle.constructor.name}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-1 text-end text-sm text-gray-400">
                {displayTime !== undefined && <span>{displayTime}s ･ </span>}
                {result.length.toLocaleString()} 件のエントリがマッチしました
              </div>
            </div>
          </div>
        </div>
      </div>
      <GitHubLink />
    </>
  )
}

export default App
