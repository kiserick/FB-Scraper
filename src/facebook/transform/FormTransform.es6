import {FacebookHandler} from '../../FacebookHandler.es6';

let DomUtils = require('domutils');
let util = require('util');

util.inherits(FormTransform, FacebookHandler);

export function FormTransform() {}

FormTransform.prototype.transform = function(form) {

	// Ensure form is in an array.
	if (!Array.isArray(form)) {
		form = [form];
	}

    let upload = {}

    // Load the inputs of the form (ignoring remove and submit inputs)
    let inputs = DomUtils.findAll(this.isInput, form)
    inputs.filter((input) => !input.attribs.name.startsWith('view_')).filter((input) => !input.attribs.name.startsWith('remove_')).forEach((input) => {
        
        // Determine if attribute already exists (may have duplicated names)
        let inputName = input.attribs.name
        let inputValue = (input.attribs.value ? input.attribs.value : '')
        if (upload[inputName]) {
            // Already exists, so load into array of values
            let values = upload[inputName]
            if (!Array.isArray(values)) {
                values = [ values ] // transform single value into array
            }
            values.push(inputValue) // append the value
            inputValue = values
            
        } 
        upload[inputName] = inputValue 
    })
    
    // Load the text areas of the form
    let textAreas = DomUtils.findAll(this.isTextArea, form)
    textAreas.forEach((textarea) => {
        upload[textarea.attribs.name] = this.extractText(textarea)
    })

	// Return the upload
	return {
        form: upload
    }
}


FormTransform.prototype.loadForm = function(form, values, filter) {
    if (!filter) {
        filter = (key) => true // include all if no filter
    }
    Object.keys(values).filter(filter).forEach((inputName) => {
        let inputValue = values[inputName]
        if (Array.isArray(inputValue)) {
            // Load input for each value
            inputValue.forEach((value) => form.append(inputName, value))
        } else {
            // Load the single input value
            form.append(inputName, inputValue)
        }
    })
}
