"use client";
import React, { useEffect } from 'react';
import { CKEditor } from "@ckeditor/ckeditor5-react";
import Editor from "ckeditor5-custom-build";
import './styles.css'

import { ArchiveBoxArrowDownIcon } from '@heroicons/react/24/outline';
import { sendToast } from '@/lib/toast';

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

// @ts-ignore
function CustomEditor( props ) {
        return (
            <CKEditor
                // @ts-ignore
                editor={ Editor.Editor }
                config={ editorConfiguration }
                data={ props.initialData }
                onReady={ editor => {
                    console.log( 'Editor is ready to use!', editor );
                    const editorBarElement = document.querySelector( '.ck-toolbar__items' );
                    const newButton = document.createElement( 'button' );
                    newButton.innerHTML = '💾';
                    newButton.classList.add( 'ck-button' );
                    newButton.onclick = () => {
                        sendToast( `Guiardando cambios en ${ props.documentId }...`);
                    };
                    editorBarElement?.prepend( newButton );
                
                }}
                onChange={ (event, editor ) => {
                    const data = editor.getData();
                    console.log( { event, editor, data } );
                } }
            />
        )
}

export default CustomEditor;