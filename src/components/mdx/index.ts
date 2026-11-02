import Note from './Note.astro';
import Details from './Details.astro';
import Terminal from './Terminal.astro';
import Columns from './Columns.astro';
import Video from './Video.astro';
import LinkCard from './LinkCard.astro';
import Figure from './Figure.astro';

/** MDX 中默认可用的组件（通过 <Content components={mdxComponents} /> 注入） */
export const mdxComponents = { Note, Details, Terminal, Columns, Video, LinkCard, Figure };
