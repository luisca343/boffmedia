export type CreateDocumentDto = {
  title: string;
  content: string;
  type: number;
};

export type CreateDocumentDtoWithUuid = CreateDocumentDto & {
  uuid: string;
};