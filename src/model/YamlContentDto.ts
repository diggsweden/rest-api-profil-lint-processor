// Define the YamlContent class
class YamlContentDto {
    // Properties
    yaml: string;
    categories: string[];

    // Constructor to initialize the object
    constructor(yaml: string, categories: string[]) {
        this.yaml = yaml;
        this.categories = categories;
    }
}

export { YamlContentDto }