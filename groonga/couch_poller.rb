require 'rubygems'
require 'net/http'
require 'pathname'
require 'json'
require 'open-uri'

TempFile  = Pathname.getwd + 'last_seq.tmp'

AuthUser  = ARGV.shift
AuthPass  = ARGV.shift
CouchHost = 'localhost'
CouchPort = 5984
CouchDb   = 'howm'

SinatHost = 'localhost'
SinatPort = 4567

last_id = nil
raise 'No!! last_seq id file' unless TempFile.exist?

TempFile.open('r') do |file|
  last_id = file.read.chomp
end

Net::HTTP.start(CouchHost, CouchPort) do |http|
  req = Net::HTTP::Get.new("/#{CouchDb}/_changes?since=#{last_id}")
  req.basic_auth AuthUser, AuthPass
  res = http.request(req)

  json = JSON.parse(res.body)

  json['results'].each do |change_row|
    docreq = Net::HTTP::Get.new("/#{CouchDb}/#{change_row['id']}")
    docreq.basic_auth AuthUser, AuthPass
    docres = http.request(docreq)

    p doc = docres.body
    Net::HTTP.start(SinatHost, SinatPort) do |sinatra|
      sinatra.post('/docs', doc)
    end
  end

  TempFile.open('w') do |file|
    file << json['last_seq'].to_s
  end
end
