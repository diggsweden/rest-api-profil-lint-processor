export interface RulesetInterface {
    given?: string;
    message?: string;
    field?: string;
    severity?:number;
    category?: string;
    function?:() => any;
    description?:string;
}
