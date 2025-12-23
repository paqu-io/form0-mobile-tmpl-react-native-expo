export default {
    form: {
      name: 'MyForm',
      description: 'This is a test description',
      elements: [
        {
          type: 'Section',
          data_name: 'personal_info',
          label: 'Personal Info',
          elements: [
            {
              type: 'TextField',
              data_name: 'first_name',
              label: 'First Name',
              required: true,
              visible: true,
              read_only: false,
              pattern: '^[a-zA-Z]+$',
              pattern_description: 'One or more letters (uppercase or lowercase), with no spaces, numbers, or symbols'
            },
            {
              type: 'NumericField',
              data_name: 'age',
              label: 'Age',
              required: true,
              visible: true,
              read_only: false,
              min: 16,
              max: 100,
              format: 'integer', //NumericField can be 'integer' or 'float'
            }
          ]
        },
        {
          type: 'CalculatedField',
          data_name: 'can_vote',
          label: 'Eligible',
          required: false, //CalcualtedField is required = false by default
          visible: true,
          read_only: true, //CalcualtedField is read_only = true by default
          calculate: 'IF($age >= 18, "yes", "no")',
          display: {
              style: 'text' // or numeric, date, currency
          }
        },
        {
            type: 'CalculatedField',
            data_name: 'calc_test',
            label: 'calc_test',
            required: false, //CalcualtedField is required = false by default
            visible: true,
            read_only: true, //CalcualtedField is read_only = true by default
            calculate: 'SETRESULT($age + 10 >= 30 ? true : false)',
            display: {
                style: 'text' // or numeric, date, currency
            }
        },
        {
            type: 'CalculatedField',
            data_name: 'calc_test_new',
            label: 'calc_test_new',
            required: false, //CalcualtedField is required = false by default
            visible: true,
            read_only: true, //CalcualtedField is read_only = true by default
            calculate: '$age + 88',
            display: {
                style: 'text' // or numeric, date, currency
            }
        },
        {
            type: 'TextField',
            data_name: 'who_voted',
            label: 'Who voted?',
            required: true,
            read_only: true,
            visible: false,
            visible_conditions: {
                and: [
                  { field_key: 'can_vote', operator: 'equal_to', value: 'yes' },
                  {
                    or: [
                      { field_key: 'age', operator: 'greater_than', value: 20 },
                      { field_key: 'first_name', operator: 'equal_to', value: 'Bob' }
                    ]
                  }
                ]
            }
        }
      ]
    }
  };