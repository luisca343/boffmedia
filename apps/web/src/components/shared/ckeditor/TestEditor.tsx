"use client";
import { useRef } from 'react';
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

interface SaveButtonConfig {
    documentId: number;
    documentType: number;
    type?: string;
    getToken: () => string;
    getDocument: () => CreateNewsDto;
    afterSave: (content: string) => void;
}

function createSaveButton(content: string, cfg: SaveButtonConfig) {
    const endpoint = cfg.type === 'news' ? 'news' : 'save';
    const btn = document.createElement('button');
    btn.id = 'saveButton';
    btn.innerHTML = '💾';
    btn.classList.add('ck-button');
    btn.onclick = () => {
        if (cfg.documentType === 1) {
            const doc = cfg.getDocument();
            DocumentsService.updateActiveNews(cfg.documentId, {
                id: cfg.documentId,
                title: doc.title || "Sin título",
                subtitle: doc.subtitle,
                category: doc.category,
                subcategory: doc.subcategory,
                author: doc.author,
                published: doc.published,
                featured: doc.featured,
                content,
                buttonText: doc.buttonText,
                imageUrl: doc.imageUrl,
            } as CreateNewsDto, cfg.getToken())
            .then(() => cfg.afterSave(content))
            .catch((err) => console.error("Error updating news content:", err));
        } else {
            const h1 = content.match(/<h1>(.*?)<\/h1>/);
            const title = !h1 || h1[1] === '&nbsp;' ? 'Sin título' : h1[1];
            rotomPOST(`/documents/${endpoint}/${cfg.documentId}`, { title, content, type: cfg.documentType })
                .then(() => {
                    sendToast(`Cambios guardados en ${title}`);
                    cfg.afterSave(content);
                });
        }
    };
    return btn;
}

// @ts-ignore
function CustomEditor(props) {
    // Refs ensure the save button's onclick always reads the latest values
    // even when CKEditor doesn't re-bind its callbacks after React re-renders.
    const tokenRef = useRef<string>(props.token ?? '');
    tokenRef.current = props.token ?? '';

    const documentRef = useRef<CreateNewsDto>(props.document);
    documentRef.current = props.document;

    const afterSaveRef = useRef<(content: string) => void>(() => {});
    afterSaveRef.current = (content: string) => {
        if (props.updateNews) props.updateNews(props.documentId, content);
        if (props.refresh) props.refresh();
    };

    if (!props.document) return null;

    const cfg: SaveButtonConfig = {
        documentId: props.documentId,
        documentType: props.documentType,
        type: props.type,
        getToken: () => tokenRef.current,
        getDocument: () => documentRef.current,
        afterSave: (content) => afterSaveRef.current(content),
    };

    return (
        <CKEditor
            // @ts-ignore
            editor={Editor.Editor}
            config={editorConfiguration}
            data={props.document.content || ''}

            onReady={editor => {
                const editorBarElement = document.querySelector('.ck-toolbar__items');
                if (props.readonly) {
                    editor.enableReadOnlyMode("sdfsedgd");
                    document.querySelector('.ck-editor__top')?.classList.add('hidden');
                }
                editorBarElement?.prepend(createSaveButton(editor.getData(), cfg));
            }}
            onChange={(_event, editor) => {
                const content = editor.getData();
                document.getElementById('saveButton')?.remove();
                document.querySelector('.ck-toolbar__items')?.prepend(createSaveButton(content, cfg));
            }}
        />
    )
}

export default CustomEditor;
