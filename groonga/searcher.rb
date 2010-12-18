require 'rubygems'
require 'drb/drb'
require 'pathname'
#require 'groonga'
require '/var/lib/gems/1.8/gems/rroonga-1.0.1/lib/groonga.rb'

Groonga::Context.default_options = {:encoding => :utf8}
BaseDir = Pathname.getwd
DbPath  = BaseDir + 'db/docs.db'
DRB_URI = 'druby://localhost:1983'

class Doc
  attr_accessor :id, :rev, :body

  def initialize(id, val, db)
    @id = id
    @body = val['body']
    @rev = val['rev']
    @db = db
  end

  def save
    if rec = @db.find(@id)
      rec['body'] = @body if rec['body'] != @body
      rec['rev']  = @rev  if rec['rev']  != @rev
    else
      @db.add @id, {:body => @body, :rev => @rev}
    end
  end

  def to_json
    {:id => @id.to_s}.to_json
  end
end

class DocServer
  def search keyword
    recs = db.select {|rec| rec['body'] =~ keyword.to_s }
    recs.map do |rec|
      id = rec.key.key.to_s
      Doc.new(id, rec, db).to_json
    end
  end

  def add(json)
    doc = Doc.new(json['_id'], {'body' => json['body'], 'rev' => json['_rev']}, db)
    doc.save
  end

  def db
    unless @db
      @db = Groonga::Database.open(DbPath.to_s)
      if @db.locked?
        @db.clear_lock
        @db.close
        @db = Groonga::Database.open(DbPath.to_s)
      end
    end
    Groonga['Docs']
  end
end

exit!(0) if fork
exit!(0) if fork

Dir::chdir('/')
File::umask(0)
STDIN.reopen("/dev/null")
STDOUT.reopen("/dev/null", "w")
STDERR.reopen("/dev/null", "w")

DRb.start_service(DRB_URI, DocServer.new)
puts DRb.uri
sleep
