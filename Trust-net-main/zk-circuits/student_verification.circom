pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/poseidon.circom";

template StudentVerification() {

    // ===== PUBLIC =====
    signal input current_year;
    signal input university_commitment;

    // ===== PRIVATE =====
    signal input student_did_numeric;  // converted Ethereum address
    signal input expiry_year;
    signal input university_secret;

    signal output isValid;

    // 1️⃣ Active Enrollment
    component lessThan = LessThan(16);
    lessThan.in[0] <== current_year;
    lessThan.in[1] <== expiry_year;
    lessThan.out === 1;

    // 2️⃣ University Affiliation
    component poseidon = Poseidon(3);
    poseidon.inputs[0] <== student_did_numeric;
    poseidon.inputs[1] <== expiry_year;
    poseidon.inputs[2] <== university_secret;

    poseidon.out === university_commitment;

    isValid <== 1;
}

component main {public [current_year, university_commitment]} = StudentVerification();