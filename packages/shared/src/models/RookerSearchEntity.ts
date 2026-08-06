/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RookerPostEntity } from './RookerPostEntity';
import type { RookerSuggestionEntity } from './RookerSuggestionEntity';
import type { RookerTrendEntity } from './RookerTrendEntity';
export type RookerSearchEntity = {
    users: Array<RookerSuggestionEntity>;
    posts: Array<RookerPostEntity>;
    tags: Array<RookerTrendEntity>;
};

