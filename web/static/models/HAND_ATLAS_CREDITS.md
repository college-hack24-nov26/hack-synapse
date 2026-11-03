# Hand anatomy collection

Original geometry: **BodyParts3D, © The Database Center for Life Science (DBCLS)**,
licensed under [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/).

- Original dataset: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/
- Original OBJ archive: https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip
- Hand subset and structure catalogue assembled/published by **Anatomio**:
  https://anatomio.org/en/human/upper-limb/hand/
- Downloaded geometry: https://anatomio.org/anatomy/hand-lab/hand.json
- Source provenance: https://anatomio.org/anatomy/limb-lab/provenance.json
- Retrieved: 2026-10-29.

`hand-atlas.json` contains 44 ready-made right-sided structures: 27 hand bones,
11 intrinsic hand muscle structures (some grouped), and six forearm muscle/tendon
structures. It is a selected subset, not a complete anatomical atlas.

NeuroGlove retains the published vertex positions and triangle indices. Structure
names/categories from the published Anatomio catalogue were added to the JSON.
Display normals are computed at runtime, coordinates are uniformly scaled and
rotated for viewing, and illustrative material colours and selection highlighting
are applied. No anatomy was generated or remodelled. The downloaded asset is
served locally; use of the viewer does not send patient/sensor data to the source.

The source collection provides whole structures; it does not supply separately
selectable tendon submeshes or every nerve, vessel, ligament, and cartilage.
