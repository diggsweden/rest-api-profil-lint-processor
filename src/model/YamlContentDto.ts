// Define an enum for contentType
enum ContentType {
    TEXT = 'TEXT',
    FILE = 'FILE',
}

// Define the YamlContent class
class YamlContentDto {
    // Properties
    yaml: string;
    categories: string[];
    contentType: ContentType;

    // Constructor to initialize the object
    constructor(yaml: string, categories: string[], contentType: ContentType) {
        this.yaml = yaml;
        this.categories = categories;
        this.contentType = contentType;
    }
}

export { YamlContentDto, ContentType }