module.exports = {
  up: (queryInterface) => {
    return queryInterface.bulkInsert(
      'files',
      [
        {
          company_id: 1,
          id: 'c5759f2c-e958-4378-bbad-e2eceae58e24',
          registry_type: 'Branches',
          registry_idkey: 2,
          document_id: 'e173aba1-2ae4-4777-a447-237bbac1b124',
          name: 'enrollment_nonf1_orlando_may_2024.pdf',
          size: 1753118,
          url: 'https://firebasestorage.googleapis.com/v0/b/milaplus-pharosit.appspot.com/o/Branches%2Fb0f83745-da07-439d-8b50-1f1fe9d064c9.pdf?alt=media&token=afeb29d7-1699-441f-946c-eb57cd1f3dfc',
          created_by: 1,
          created_at: new Date(),
        },
        {
          company_id: 1,
          id: '85af2a28-c6e7-4f3a-81bb-8441583fe1f2',
          registry_type: 'Branches',
          registry_idkey: 2,
          document_id: '406b914c-f389-4a7a-92a2-2d01a269a114',
          name: 'enrollment_orlando_may_2024_DRAFT.pdf',
          size: 2157319,
          url: 'https://firebasestorage.googleapis.com/v0/b/milaplus-pharosit.appspot.com/o/Branches%2Fbd462a57-e75d-4bcc-b349-a24db3110e40.pdf?alt=media&token=3b05d64c-5cc9-493e-8ea4-51881555288d',
          created_by: 1,
          created_at: new Date(),
        },
      ],
      {}
    );
  },

  down: (queryInterface) => {
    return queryInterface.bulkDelete('files', [], {});
  },
};
