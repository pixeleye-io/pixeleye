"use client";

import { DocSearch as Search } from '@docsearch/react';
import './search.css';


export function DocSearch() {

    return (
        <Search indexName='pixeleye' apiKey='b0c6d1ff6949bf05c049abe4209ad481' appId='DVHY2LO2GG' />
    )
}