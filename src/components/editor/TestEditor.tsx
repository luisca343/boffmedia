"use client";
import React, { useEffect } from 'react';
import { CKEditor } from "@ckeditor/ckeditor5-react";
import Editor from "./ckeditor.js"
import './styles.css'
import { sendToast } from '@/lib/toast';
import { rotomPOST } from '@/services/boffAPI';

const editorConfiguration = {
    toolbar: {
        items: [
            'heading',
            '|',
            'bold',
            'underline',
            'strikethrough',
            'removeFormat',
            'fontSize',
            'fontColor',
            'fontBackgroundColor',
            'fontFamily',
            'findAndReplace',
            '|',
            'todoList',
            'bulletedList',
            'numberedList',
            'alignment',
            'outdent',
            'indent',
            'subscript',
            'superscript',
            '|',
            'imageInsert',
            'imageUpload',
            'blockQuote',
            'insertTable',
            'mediaEmbed',
            'undo',
            'redo',
            'code',
            'selectAll',
            'codeBlock',
            'htmlEmbed',
            'sourceEditing',
            'style',
            '|',
            'pageBreak',
            'showBlocks',
            'horizontalLine',
            'specialCharacters',
            'restrictedEditingException',
            'accessibilityHelp'
        ]
    },
    language: 'es',
    image: {
        toolbar: [
            'imageTextAlternative',
            'toggleImageCaption',
            'imageStyle:inline',
            'imageStyle:block',
            'imageStyle:side'
        ]
    },
    table: {
        contentToolbar: [
            'tableColumn',
            'tableRow',
            'mergeTableCells',
            'tableCellProperties'
        ]
    }
};

function createSaveButton (data: any, props: { documentId: any; documentType: any; refresh: () => void; type?: string; }) {
    console.log("=== CREATE SAVE BUTTON ===");
    const endpoint = props.type === 'news' ? 'savenews' : 'save';
    const saveButton = document.createElement('button');
    saveButton.id = 'saveButton';
    saveButton.innerHTML = '💾';
    saveButton.classList.add('ck-button');
    saveButton.onclick = () => {
        const documentId = props.documentId;
        const h1 = data.match(/<h1>(.*?)<\/h1>/);
        let title = !h1 || h1[1] === '&nbsp;' ? 'Sin título' : h1[1];
        rotomPOST(`/documents/${endpoint}/${documentId}`, { title, content: data, documentType: props.documentType })
            .then(() => {
                console.log("SAVED SAVED SAVED");
                console.log({ id: props.documentId, title, data });
                sendToast(`Cambios guardados en ${title}`);
                if(props) props.refresh();
            });
    };
    return saveButton;
};

// @ts-ignore
function CustomEditor(props) {
    return (
        <CKEditor
            // @ts-ignore
            editor={Editor.Editor}
            config={editorConfiguration}
            data={props.document.content}

            onReady={editor => {
                console.log('Editor is ready to use!', editor);
                const editorBarElement = document.querySelector('.ck-toolbar__items');
                if (props.readonly) {
                    editor.enableReadOnlyMode("sdfsedgd");
                    document.querySelector('.ck-editor__top')?.classList.add('hidden');
                }
                const saveButton = createSaveButton(editor, props);
                editorBarElement?.prepend(saveButton);
            }}
            onChange={(event, editor) => {
                const data = editor.getData();
                // Recreate the save button
                const saveButton = document.getElementById('saveButton');
                if (saveButton) {
                    saveButton.remove();
                }
                const editorBarElement = document.querySelector('.ck-toolbar__items');
                const newSaveButton = createSaveButton(data, props);
                editorBarElement?.prepend(newSaveButton);
            }}
        />
    )
}

export default CustomEditor;