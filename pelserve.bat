call activate blog

start cont_pelpub.bat

pushd output
python -m pelican.server
popd