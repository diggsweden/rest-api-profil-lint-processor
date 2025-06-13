// Define the YamlContent class
export class UrlContentDto {
    url: string;
    categories: string[];

    // Constructor to initialize the object
    constructor(url: string, categories: string[]) {
        this.url = url;
        this.categories = categories;
    }
}
