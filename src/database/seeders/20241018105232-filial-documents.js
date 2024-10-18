module.exports = {
  up: (queryInterface) => {
    return queryInterface.bulkInsert(
      'filialdocuments',
      [
        {
          company_id: 1,
          id: '806ac6f3-9aa9-441d-a50e-1c5d24781a45',
          file_id: 'c5759f2c-e958-4378-bbad-e2eceae58e24',
          filial_id: 2,
          document_id: 'e173aba1-2ae4-4777-a447-237bbac1b124',
          created_by: 1,
          created_at: new Date(),
        },
        {
          company_id: 1,
          id: 'edcc2db8-c619-47c6-96a1-3b82560fa56b',
          file_id: '85af2a28-c6e7-4f3a-81bb-8441583fe1f2',
          filial_id: 2,
          document_id: '406b914c-f389-4a7a-92a2-2d01a269a114',
          created_by: 1,
          created_at: new Date(),
        },
      ],
      {}
    );
  },

  down: (queryInterface) => {
    return queryInterface.bulkDelete('filialdocuments', [], {});
  },
};
