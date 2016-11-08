require_relative '../serverspec_init'

describe 'Javase image integration test' do
 it 'returns port 8080 properties web page' do
    sleep 10
    expect(command('curl --write-out %{http_code} --silent --output /dev/null http://localhost:8080').stdout).to eq('200')
    expect(command('curl -L http://localhost:8080').stdout).to include 'System Environment Variables'
 end

end