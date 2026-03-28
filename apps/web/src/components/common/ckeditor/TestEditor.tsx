"use client";
import React, { useEffect } from 'react';
import { CKEditor } from "@ckeditor/ckeditor5-react";
import Editor from "./ckeditor.js"
import './styles.css'
import { sendToast } from '@/lib/toast';
import { rotomPOST } from '@/services/boffAPI';
import { DocumentsService } from '@/services/api/smartrotom/documentsService';
import { CreateNewsDto } from '@boffmedia/shared';

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

function createSaveButton (data: any, props: {
    updateNews: any; documentId: any; documentType: any; refresh: () => void; type?: string; 
}) {
    console.log("=== CREATE SAVE BUTTON ===");
    const endpoint = props.type === 'news' ? 'news' : 'save';
    const saveButton = document.createElement('button');
    saveButton.id = 'saveButton';
    saveButton.innerHTML = '💾';
    saveButton.classList.add('ck-button');
    saveButton.onclick = () => {
        const documentId = props.documentId;
        const h1 = data.match(/<h1>(.*?)<\/h1>/);
        let title = !h1 || h1[1] === '&nbsp;' ? 'Sin título' : h1[1];
        
        if(props.documentType === 1) {
            DocumentsService.updateActiveNews(documentId, {
                content: data,
                id: documentId,
                title: title || "Sin título",
              } as CreateNewsDto)
            .then(() => {
                if(props.refresh) props.refresh();
                if(props.updateNews) props.updateNews(props.documentId, data);
            }).catch((error) => {
                console.error("Error updating news content:", error);
            });
        } else rotomPOST(`/documents/${endpoint}/${documentId}`, { title, content: data, type: props.documentType })
            .then(() => {
                sendToast(`Cambios guardados en ${title}`);
                if(props.refresh) props.refresh();
                if(props.updateNews) props.updateNews(props.documentId, data);
            });
    };
    return saveButton;
};

// @ts-ignore
function CustomEditor(props) {
    if(!props.document) return null;
    return (
        <CKEditor
            // @ts-ignore
            editor={Editor.Editor}
            config={editorConfiguration}
            data={props.document.content || ''}

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