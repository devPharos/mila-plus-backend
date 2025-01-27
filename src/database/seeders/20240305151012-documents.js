module.exports = {
    up: queryInterface => {
        return queryInterface.bulkInsert(
            'documents',
            [
                {
                    company_id: 1,
                    id: '406b914c-f389-4a7a-92a2-2d01a269a114',
                    origin: 'Branches',
                    type: 'Contracts',
                    subtype: 'F1 Contract',
                    title: 'F1 Contract Template',
                    multiple: false,
                    required: false,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: 'e173aba1-2ae4-4777-a447-237bbac1b124',
                    origin: 'Branches',
                    type: 'Contracts',
                    subtype: 'Non-F1 Contract',
                    title: 'Non-F1 Contract Template',
                    multiple: false,
                    required: false,
                    created_by: 1,
                    created_at: new Date()
                },



                {
                    company_id: 1,
                    id: 'c2ae2611-bfa7-4472-ae3e-0bc1d6d56176',
                    origin: 'Enrollment',
                    type: 'Change of Status',
                    subtype: 'Dependent',
                    title: '1. Passport copy',
                    multiple: false,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: '1c3f2bdb-d93f-411c-b1dc-c053c78a6810',
                    origin: 'Enrollment',
                    type: 'Change of Status',
                    subtype: 'Dependent',
                    title: '2. Visa copy',
                    multiple: false,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: '84cd7881-9545-4ef2-8141-bbfe2cd8060b',
                    origin: 'Enrollment',
                    type: 'Change of Status',
                    subtype: 'Dependent',
                    title: '3. I-94 or I-797 copy',
                    multiple: false,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: '8b92ab72-6205-481c-a7be-d034d73a03e1',
                    origin: 'Enrollment',
                    type: 'Change of Status',
                    subtype: 'Sponsor',
                    title: '1. Passport copy ( or ID, CNH, Driver License)',
                    multiple: false,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: 'eba62eff-1a45-4c83-a9b3-94c2e9629256',
                    origin: 'Enrollment',
                    type: 'Change of Status',
                    subtype: 'Sponsor',
                    title: '2. Bank statement',
                    multiple: true,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: '4cad12fa-d0ac-4640-9d77-eef05afb2e10',
                    origin: 'Enrollment',
                    type: 'Change of Status',
                    subtype: 'Student',
                    title: '1. Passport copy',
                    multiple: false,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: '98852960-9333-4b21-a2a4-b917bcb8e4d2',
                    origin: 'Enrollment',
                    type: 'Change of Status',
                    subtype: 'Student',
                    title: '2. Visa copy',
                    multiple: false,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: '782fe8d7-8386-4540-9151-74110a2907a8',
                    origin: 'Enrollment',
                    type: 'Change of Status',
                    subtype: 'Student',
                    title: '3. I-94 or I-797 copy',
                    multiple: false,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: '4ffa01f9-ac90-4bc9-a095-50ed1f1c8db2',
                    origin: 'Enrollment',
                    type: 'Change of Status',
                    subtype: 'Student',
                    title: '4. Mariage certificate copy, if applicable',
                    multiple: false,
                    required: false,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: '0f5da005-6c27-403a-9802-94ca595e1ef2',
                    origin: 'Enrollment',
                    type: 'Change of Status',
                    subtype: 'Student',
                    title: '5. Bank statement supporting the amount, depending on the time of study',
                    multiple: true,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },




                {
                    company_id: 1,
                    id: 'e49bed34-c405-4541-9f74-21e993ba2960',
                    origin: 'Enrollment',
                    type: 'Initial Visa',
                    subtype: 'Dependent',
                    title: '1. Passport copy',
                    multiple: false,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: '542bb03e-fbe0-4687-8a41-f30d6ed602fa',
                    origin: 'Enrollment',
                    type: 'Initial Visa',
                    subtype: 'Sponsor',
                    title: '1. Passport copy ( or ID, CNH, Driver License)',
                    multiple: false,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: 'a918ff20-39ef-45ec-96e3-f50e0add0caf',
                    origin: 'Enrollment',
                    type: 'Initial Visa',
                    subtype: 'Sponsor',
                    title: '2. Bank statement',
                    multiple: true,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: '04bb56cc-6aa5-43e4-a474-2df1e221e461',
                    origin: 'Enrollment',
                    type: 'Initial Visa',
                    subtype: 'Student',
                    title: '1. Passport copy',
                    multiple: false,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: 'bee6d54b-85f9-4527-83cf-f5a6509632fd',
                    origin: 'Enrollment',
                    type: 'Initial Visa',
                    subtype: 'Student',
                    title: '2. Mariage certificate copy, if applicable',
                    multiple: false,
                    required: false,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: '53489e60-8169-45e1-af7e-64300c025c0c',
                    origin: 'Enrollment',
                    type: 'Initial Visa',
                    subtype: 'Student',
                    title: '3. Bank statement',
                    multiple: true,
                    required: false,
                    created_by: 1,
                    created_at: new Date()
                },




                {
                    company_id: 1,
                    id: '4a3daa1c-20b7-490a-981d-9e323bfa135f',
                    origin: 'Enrollment',
                    type: 'Reinstatement',
                    subtype: 'Dependent',
                    title: '1. Passport copy',
                    multiple: false,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: '3f220d4f-649f-478a-b519-25b98303a2e9',
                    origin: 'Enrollment',
                    type: 'Reinstatement',
                    subtype: 'Dependent',
                    title: '2. Visa copy',
                    multiple: false,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: '0feb9bab-ccac-480a-9591-ccf3b8c0308c',
                    origin: 'Enrollment',
                    type: 'Reinstatement',
                    subtype: 'Dependent',
                    title: '3. I-94 or I-797 copy',
                    multiple: false,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: 'b3a665a9-e1a7-4c5f-accd-12704890b1b4',
                    origin: 'Enrollment',
                    type: 'Reinstatement',
                    subtype: 'Dependent',
                    title: '4. I-20 copy',
                    multiple: false,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: '3774c956-3e7a-43ef-a247-ee91a9096b38',
                    origin: 'Enrollment',
                    type: 'Reinstatement',
                    subtype: 'Sponsor',
                    title: '1. Passport copy ( or ID, CNH, Driver License)',
                    multiple: false,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: 'b661607f-e750-4606-a276-0c90765982a1',
                    origin: 'Enrollment',
                    type: 'Reinstatement',
                    subtype: 'Sponsor',
                    title: '2. Bank statement',
                    multiple: true,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: 'b2b84ba2-3a3f-4a07-88f9-d5442015c9a6',
                    origin: 'Enrollment',
                    type: 'Reinstatement',
                    subtype: 'Student',
                    title: '1. Passport copy',
                    multiple: false,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: 'ae9934da-3757-4376-b0c9-5ee62518b363',
                    origin: 'Enrollment',
                    type: 'Reinstatement',
                    subtype: 'Student',
                    title: '2. Visa copy',
                    multiple: false,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: '888cf5da-3174-4559-8ca3-55613bac96dd',
                    origin: 'Enrollment',
                    type: 'Reinstatement',
                    subtype: 'Student',
                    title: '3. I-94 or I-797 copy',
                    multiple: false,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: '0b69dcb5-93a4-4ce3-8a7c-8c17e315540b',
                    origin: 'Enrollment',
                    type: 'Reinstatement',
                    subtype: 'Student',
                    title: '4. I-20 copy',
                    multiple: false,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: '9fe8583b-a907-4579-b82d-73fd71c29fdb',
                    origin: 'Enrollment',
                    type: 'Reinstatement',
                    subtype: 'Student',
                    title: '5. Mariage certificate copy, if applicable',
                    multiple: false,
                    required: false,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: 'd39dedfe-769b-4f78-bf69-e8a625620eb7',
                    origin: 'Enrollment',
                    type: 'Reinstatement',
                    subtype: 'Student',
                    title: '6. Bank statement',
                    multiple: true,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },




                {
                    company_id: 1,
                    id: '76e6bcb1-1170-4354-a66c-bab01662402b',
                    origin: 'Enrollment',
                    type: 'Transfer',
                    subtype: 'Dependent',
                    title: '1. Passport copy',
                    multiple: false,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: '431e4fda-f413-43c9-989f-e17a14389923',
                    origin: 'Enrollment',
                    type: 'Transfer',
                    subtype: 'Dependent',
                    title: '2. Visa copy',
                    multiple: false,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: 'ffc648b7-4b0e-4e83-bf42-0878fb330837',
                    origin: 'Enrollment',
                    type: 'Transfer',
                    subtype: 'Dependent',
                    title: '3. I-94 or I-797 copy',
                    multiple: false,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: '1a66572a-86d3-42c4-8320-ce6caa92cbc7',
                    origin: 'Enrollment',
                    type: 'Transfer',
                    subtype: 'Dependent',
                    title: '4. I-20 copy',
                    multiple: false,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: 'cfc5839b-f005-4760-abd5-6e5aa9be8a28',
                    origin: 'Enrollment',
                    type: 'Transfer',
                    subtype: 'Sponsor',
                    title: '1. Passport copy ( or ID, CNH, Driver License)',
                    multiple: false,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: '19dcc169-bb77-469f-a4e4-13d970e61627',
                    origin: 'Enrollment',
                    type: 'Transfer',
                    subtype: 'Sponsor',
                    title: '2. Bank statement',
                    multiple: true,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: '3a35f177-5bf7-43fe-ba0d-5a807d7ac598',
                    origin: 'Enrollment',
                    type: 'Transfer',
                    subtype: 'Student',
                    title: '1. Passport copy',
                    multiple: false,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: '18ee5bcc-fa96-4359-99b9-15b7a28c1569',
                    origin: 'Enrollment',
                    type: 'Transfer',
                    subtype: 'Student',
                    title: '2. Visa copy',
                    multiple: false,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: 'afaf66be-bf6a-46d3-a1d3-48e0eedc3951',
                    origin: 'Enrollment',
                    type: 'Transfer',
                    subtype: 'Student',
                    title: '3. I-94 or I-797 copy',
                    multiple: false,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: '1d05e7b4-c414-4249-a07c-decbae1a9e9a',
                    origin: 'Enrollment',
                    type: 'Transfer',
                    subtype: 'Student',
                    title: '4. I-20 copy',
                    multiple: false,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: '65a567f7-b0bd-4aa7-bd60-a937b87113bc',
                    origin: 'Enrollment',
                    type: 'Transfer',
                    subtype: 'Student',
                    title: '5. Mariage certificate copy, if applicable',
                    multiple: false,
                    required: false,
                    created_by: 1,
                    created_at: new Date()
                },
                {
                    company_id: 1,
                    id: '59067d34-d76c-41ad-bc04-251e883c9e2f',
                    origin: 'Enrollment',
                    type: 'Transfer',
                    subtype: 'Student',
                    title: '6. Bank statement',
                    multiple: true,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },




                {
                    company_id: 1,
                    id: '387a7cb2-8a32-49ee-bd21-35471ea5ea93',
                    origin: 'Transfer Eligibility',
                    type: 'Transfer',
                    subtype: 'Student',
                    title: '1. Latest I-20 copy',
                    multiple: false,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },




                {
                    company_id: 1,
                    id: 'b9a535cf-f175-4e7f-89a0-0d7aa5095024',
                    origin: 'Enrollment',
                    type: 'Private',
                    subtype: 'Student',
                    title: '1. Passport copy ( or ID, CNH, Driver License)',
                    multiple: false,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },




                {
                    company_id: 1,
                    id: '205e602c-679b-4310-b040-d47c450518cf',
                    origin: 'Enrollment',
                    type: 'Regular',
                    subtype: 'Student',
                    title: '1. Passport copy ( or ID, CNH, Driver License)',
                    multiple: false,
                    required: true,
                    created_by: 1,
                    created_at: new Date()
                },
            ],
            {}
        );
    },

    down: queryInterface => {
        return queryInterface.bulkDelete('documents', [], {});
    },
};
