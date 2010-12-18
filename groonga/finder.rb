require 'rubygems'
require 'sinatra'
require 'json'
require 'drb/drb'

DocServer = DRbObject.new_with_uri('druby://localhost:1983')

get '/word/:word' do |word|
  content_type :json
  offset = 0
  rows   = DocServer.search(word).map{|doc| JSON.parse(doc) }
  {'total_rows' => rows.size, 'offset' => offset, 'rows' => rows}.to_json
end

post '/docs' do
  json  = JSON.parse(request.body.read)
  DocServer.add json
  'success'
end
