with import <nixpkgs> {};

mkShell {
  buildInputs = [
    nodejs
  ] ++ (with nodePackages; [
    pnpm
  ]);

  shellHook = ''
    export PATH="./node_modules/.bin:$PATH"
    alias watch="rescript build -w"
  '';
}
