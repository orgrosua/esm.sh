import localforage from '/localforage'
import ReactDom from '/react-dom@17'
import React, { useCallback, useEffect, useRef, useState } from '/react@17'
import { createEditor, createModel } from './editor.js'
import preset from './preset.js'

localforage.getItem('file-index.html').then(value => {
	if (!value) {
		localforage.setItem('current-file', 'index.html')
		Object.entries(preset).forEach(([name, content]) => {
			localforage.setItem(`file-${name}`, content)
		})
	}
})

function App() {
	const [siderWidth, setSiderWidth] = useState(100)
	const [editorWidth, setEditorWidth] = useState(0.5)
	const [previewUrl, setPreviewUrl] = useState('/embed/playground/index.html')
	const [files, setFiles] = useState(null)
	const [currentFile, setCurrentFile] = useState(null)
	const editorRef = useRef()
	const editorContainerRef = useRef()

	const addFile = useCallback(() => {
		let name
		if (name = prompt('Add New File:')) {
			const model = createModel(name, '')
			if (model) {
				setFiles(files => [...files, { name, model }])
				setCurrentFile(name)
			}
		}
	}, [])

	const refresh = useCallback(() => {
		setPreviewUrl('/embed/playground/index.html?' + Date.now())
	}, [])

	useEffect(() => {
		(async () => {
			let files = []
			let currentFile = null
			const indexHtml = await localforage.getItem('file-index.html')
			if (indexHtml) {
				const keys = await localforage.keys()
				files = await Promise.all(keys.map(async key => {
					if (key.startsWith('file-')) {
						const name = key.slice(5)
						const source = await localforage.getItem(key)
						const model = createModel(name, source)
						return { name, model }
					}
				}))
				currentFile = await localforage.getItem('current-file')
			} else {
				await Promise.all(Object.entries(preset).map(async ([name, content]) => {
					files.push({ name, model: createModel(name, content) })
					await localforage.setItem(`file-${name}`, content)
				}))
				currentFile = 'index.html'
				await localforage.setItem('current-file', currentFile)
				refresh()
			}
			editorRef.current = createEditor(editorContainerRef.current)
			setFiles(files.filter(Boolean))
			setCurrentFile(currentFile)
		})()
	}, [])

	useEffect(() => {
		if (files && currentFile) {
			const file = files.find(file => file.name == currentFile)
			if (file && editorRef.current) {
				editorRef.current.setModel(file.model)
			}
		}
	}, [currentFile, files])

	return (
		<>
			<div className="sider" style={{ width: siderWidth }} >
				{!files && <div className="file-item loading"><em>loading...</em></div>}
				{files && files.map(file => {
					return (
						<div
							className={["file-item", currentFile === file.name && 'active'].filter(Boolean).join(' ')}
							onClick={() => setCurrentFile(file.name)}
							key={file.name}
						>
							<span>{file.name}</span>
						</div>
					)
				})}
				<div className="file-item add" onClick={addFile}>
					<svg style={{ width: '1em', height: '1em' }} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M14 8H8V14H6V8H0V6H6V0H8V6H14V8Z" fill="currentColor" />
					</svg>
				</div>
			</div>
			<div className="editor" style={{ left: siderWidth, width: `${editorWidth * 100}vw` }} ref={editorContainerRef} />
			<div className="preview" style={{ right: 0, width: `calc(${(1 - editorWidth) * 100}vw - ${siderWidth}px)` }} >
				<iframe src={previewUrl}></iframe>
				<div className="refresh" onClick={refresh}>
					<svg style={{ width: '1em', height: '1em' }} viewBox="0 0 36 37" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M30.6914 5.27344L35.9648 0V15.8203H20.1445L27.4219 8.54297C24.75 5.87108 21.586 4.53516 17.9297 4.53516C14.2031 4.53516 11.0215 5.8535 8.38477 8.49023C5.74803 11.127 4.42969 14.3086 4.42969 18.0352C4.42969 21.7617 5.74803 24.9433 8.38477 27.5801C11.0215 30.2168 14.2031 31.5352 17.9297 31.5352C20.8828 31.5352 23.5195 30.709 25.8398 29.0566C28.1602 27.4043 29.7773 25.2422 30.6914 22.5703H35.332C34.3477 26.5078 32.2383 29.7422 29.0039 32.2734C25.7695 34.8047 22.0781 36.0703 17.9297 36.0703C13.0078 36.0703 8.78908 34.3125 5.27344 30.7969C1.7578 27.2812 0 23.0274 0 18.0352C0 13.0429 1.7578 8.78908 5.27344 5.27344C8.78908 1.7578 13.0078 0 17.9297 0C22.9219 0 27.1758 1.7578 30.6914 5.27344Z" fill="currentColor" />
					</svg>
				</div>
			</div>
		</>
	)
}

ReactDom.render(<App />, document.getElementById('root'))