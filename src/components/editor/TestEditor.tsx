import React from 'react';
import { CKEditor } from "@ckeditor/ckeditor5-react";
import Editor from "ckeditor5-custom-build";
import './styles.css'

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
    console.log(Editor)
        return (
            <CKEditor
                // @ts-ignore
                editor={ Editor.Editor }
                config={ editorConfiguration }
                data={ props.initialData }
                onChange={ (event, editor ) => {
                    const data = editor.getData();
                    console.log( { event, editor, data } );
                } }
            />
        )
}

export default CustomEditor;