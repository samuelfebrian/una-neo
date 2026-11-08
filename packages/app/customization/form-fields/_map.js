// Fork-level overrides of form field renderers (this seam exists so core
// files stay untouched and upgrades stay clean).
import dynamic from 'next/dynamic';
import { componentsMapDefault } from 'app/components/form-fields/_map';

// Fork copy of components/form-fields/files.js with the video branch in the
// single-file preview tile: core renders the tile only for images and leaves
// video submissions blank-white until submit. See files.js header for details.
const FilesFixed = dynamic(() => import('./files'));

componentsMapDefault.files = FilesFixed;

export const componentsMap = componentsMapDefault;
