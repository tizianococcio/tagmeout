// Import the necessary Obsidian components
import { Plugin, TFile, MarkdownPostProcessorContext, MarkdownRenderer, App } from 'obsidian';
import * as path from 'path';

// Define the plugin class, which should extend the Plugin class from Obsidian
export default class TagReaderPlugin extends Plugin {
    // define a global property
    private filename: string = '';

    private el: HTMLElement | null = null;
    private ctx: MarkdownPostProcessorContext | null = null;
    private source: string = '';

    async onload() {
        // Call the onload method of the superclass
        super.onload();

        // Register the plugin with Obsidian
        this.registerMarkdownCodeBlockProcessor('tagsummary', this.processCodeBlock.bind(this));

        this.app.metadataCache.on('changed', this.handleFileChange.bind(this));
    }
    async handleFileChange(file: TFile) {
        
        const activeFile = this.getActiveFilePath()
        const fullPath = path.join(activeFile? activeFile : "", `${this.filename}.md`);
        const fileContainingTagsPath = this.app.vault.getAbstractFileByPath(fullPath);
    
        if (file.path === fileContainingTagsPath?.path && this.el && this.ctx) {
          // The file containing the tags has changed, update the list
          this.el.empty(); // Clear the current content of the HTMLElement
          await this.processCodeBlock(this.source, this.el, this.ctx); // Call processCodeBlock() with the stored HTMLElement and MarkdownPostProcessorContext
        }
    }
   
    async processCodeBlock(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
        this.source = source;
        this.el = el;
        this.ctx = ctx;

        // Split the source string into the filename and the tags
        const [filename, tag] = source.split(':');

        // Store filename in the global property
        this.filename = filename;

        // Split the tags into an array
        const tags = tag.split(',').map((tag) => `#${tag.trim()}`);

        // Retrieve the file from the vault
        const activeFile = this.getActiveFilePath()
        const fullPath = path.join(activeFile? activeFile : "", `${filename}.md`);
        const file = this.app.vault.getAbstractFileByPath(fullPath);

        // Initialize an object to store the headers following each tag
        const headersFollowingTags: Record<string, string[]> = {};

        // check if file exists
        if (file instanceof TFile) {
            // Read the file content
            const fileContent = await this.app.vault.read(file);

            // Parse the file content to extract the headers following each tag
            this.parseTagsFromFileContent(fileContent, tags, headersFollowingTags);

            // Render the headers list
            this.renderHeadersList(file, tags, headersFollowingTags, el, ctx);

        } else {
            // File not found
            const output = `File ${filename} not found`;

            // Render
            el.createEl('div', { text: output });
        }


    }
    parseTagsFromFileContent(content: string, tags: string[], headersFollowingTags: Record<string, string[]>) {
        // Define a regular expression to match tags followed by headers in the content
        const tagAndHeaderRegex = /(^|\s)(#[^\s]+)(?:[\s\S]*?)(?<=\n)([^\n]+)/gm;
        let match;

        // Iterate over the matches and update the tags object and headersFollowingTags object
        while ((match = tagAndHeaderRegex.exec(content)) !== null) {
            const tag = match[2].toLowerCase();
            const header = match[3];
            // Check if the tag is one of the tags we are looking for
            if (tags.includes(tag)) {
                // Check if the tag is already present in the headersFollowingTags object
                if (headersFollowingTags[tag]) {
                    // Add the header to the array of headers following the tag
                    headersFollowingTags[tag].push(header);
                } else {
                    // Create a new array with the header as the first element
                    headersFollowingTags[tag] = [header];
                }
            }
        }
    }
    getActiveFilePath(): string | null {
        // Get the path of the active file
        const activeFile = app.workspace.getActiveFile();
        if (activeFile === null) {
            return null;
        }
        // Return the path of the active file - Note that I select parent.path instead of path because I want the path of the folder containing the file
        return activeFile.parent.path;
    }     
    async renderHeadersList(file: TFile, tags: string[], headersFollowingTags: Record<string, string[]>, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
            // Render the output to the provided HTMLElement
            const div_container = el.createEl('div');

            for (const [tag, headers] of Object.entries(headersFollowingTags)) {

                const headersCount = headers.length;
                div_container.createEl('h1', { cls: 'te-tag-header', text: `${tag} (${headersCount})` });

                // Create a list element
                const list = div_container.createEl('ul', { cls: 'te-list' });

                // Get the title of the file
                const noteTitle = file.basename;

                // Create a list item for each header
                for (let header of headers) {
                    // Remove the # from the header
                    header = header.replace(/#+\s/, '');
                    // Create the link text
                    const linkText = `${header} [[${noteTitle}#${header}|Link]]`;
                    // Create a list item
                    const listItem = list.createEl('li', { cls: 'te-list-item' });

                    // Render the Markdown content of the item and append the output to the list item
                    await MarkdownRenderer.renderMarkdown(linkText, listItem, ctx.sourcePath, this);

                }
            }

    }
}
